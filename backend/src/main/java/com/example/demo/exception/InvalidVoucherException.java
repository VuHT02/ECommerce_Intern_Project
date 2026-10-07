package com.example.demo.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Ngoại lệ ném ra khi voucher giảm giá không hợp lệ (hết hạn, sai mã, chưa đủ giá trị đơn hàng tối thiểu, hết lượt).
 * HTTP Status tương ứng: 400 BAD_REQUEST
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InvalidVoucherException extends BadRequestException {

    public InvalidVoucherException(String message) {
        super(message);
    }
}
