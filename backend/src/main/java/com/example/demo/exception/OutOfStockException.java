package com.example.demo.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Ngoại lệ ném ra khi sản phẩm hết hàng hoặc số lượng tồn kho không đủ đáp ứng.
 * HTTP Status tương ứng: 409 CONFLICT (hoặc 400 BAD_REQUEST)
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class OutOfStockException extends InsufficientStockException {

    public OutOfStockException(String productName) {
        super("Sản phẩm '" + productName + "' hiện đã hết hàng trong kho!");
    }

    public OutOfStockException(String productName, int availableQuantity, int requestedQuantity) {
        super(String.format("Sản phẩm '%s' không đủ số lượng! Trong kho còn %d chiếc, nhưng bạn yêu cầu %d chiếc.",
                productName, availableQuantity, requestedQuantity));
    }
}
