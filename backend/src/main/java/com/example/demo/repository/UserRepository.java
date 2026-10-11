package com.example.demo.repository;

import com.example.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    Optional<User> findByEmail(String email);

    /** Locks the account row while issuing or consuming a reset code. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.email = :email")
    Optional<User> findByEmailForUpdate(@Param("email") String email);

    boolean existsByEmail(String email);

    Optional<User> findByPhone(String phone);

    List<User> findByRole(String role);

    List<User> findByActiveTrue();

    long countByRoleIgnoreCase(String role);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where upper(u.role) in ('ADMIN', 'ROLE_ADMIN') order by u.id")
    List<User> lockAdminAccountsForUpdate();
}
