package com.example.demo.controller;

import com.example.demo.dto.ErrorResponse;
import com.example.demo.dto.OrderResponse;
import com.example.demo.entity.User;
import com.example.demo.exception.GlobalExceptionHandler;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderControllerTest {

    @Mock
    private OrderService orderService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private HttpServletRequest servletRequest;

    @InjectMocks
    private OrderController orderController;

    @Test
    void givenAnotherUsersOrderId_whenGetOrderById_thenAccessIsDeniedWith403() {
        UserDetails userB = org.springframework.security.core.userdetails.User
                .withUsername("user-b@example.test")
                .password("unused")
                .roles("USER")
                .build();
        User userBEntity = new User();
        userBEntity.setId(2L);

        when(orderService.getOrderById(1001L)).thenReturn(
                OrderResponse.builder().id(1001L).userId(1L).build());
        when(userRepository.findByEmail("user-b@example.test")).thenReturn(Optional.of(userBEntity));

        AccessDeniedException exception = assertThrows(AccessDeniedException.class,
                () -> orderController.getOrderById(1001L, userB));

        assertEquals("Bạn không có quyền truy cập đơn hàng của tài khoản khác.", exception.getMessage());
        verify(orderService).getOrderById(1001L);

        ResponseEntity<ErrorResponse> forbidden = new GlobalExceptionHandler()
                .handleAccessDenied(exception, servletRequest);
        assertEquals(403, forbidden.getStatusCode().value());
    }

    @Test
    void givenOwnOrderId_whenGetOrderById_thenOrderIsReturned() {
        UserDetails owner = org.springframework.security.core.userdetails.User
                .withUsername("owner@example.test")
                .password("unused")
                .roles("USER")
                .build();
        User ownerEntity = new User();
        ownerEntity.setId(5L);
        OrderResponse order = OrderResponse.builder().id(1002L).userId(5L).build();

        when(orderService.getOrderById(1002L)).thenReturn(order);
        when(userRepository.findByEmail("owner@example.test")).thenReturn(Optional.of(ownerEntity));

        ResponseEntity<?> response = orderController.getOrderById(1002L, owner);

        assertEquals(200, response.getStatusCode().value());
    }
}
