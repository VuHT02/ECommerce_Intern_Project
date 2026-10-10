package com.example.demo.service;

import com.example.demo.exception.BadRequestException;
import com.example.demo.exception.GoogleVerificationUnavailableException;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

@Component
@Slf4j
public class GoogleCredentialVerifier {

    @Value("${google.oauth.client-id:}")
    private String clientId;

    private volatile GoogleIdTokenVerifier verifier;

    public GoogleIdToken.Payload verify(String credential) {
        if (clientId == null || clientId.isBlank()) {
            throw new BadRequestException("Google OAuth chÆ°a Ä‘Æ°á»£c cáº¥u hÃ¬nh á»Ÿ backend.");
        }

        try {
            GoogleIdToken idToken = getVerifier().verify(credential);
            if (idToken == null) {
                throw new BadRequestException("Google credential khÃ´ng há»£p lá»‡ hoáº·c Ä‘Ã£ háº¿t háº¡n.");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            if (payload.getEmail() == null || payload.getEmail().isBlank()
                    || payload.getSubject() == null || payload.getSubject().isBlank()
                    || !Boolean.TRUE.equals(payload.getEmailVerified())) {
                throw new BadRequestException("TÃ i khoáº£n Google chÆ°a cÃ³ email Ä‘Æ°á»£c xÃ¡c minh.");
            }
            return payload;
        } catch (BadRequestException exception) {
            throw exception;
        } catch (GeneralSecurityException | IOException exception) {
            log.error("Could not verify Google ID token because Google's verification service is unavailable.", exception);
            throw new GoogleVerificationUnavailableException(
                    "KhÃ´ng thá»ƒ káº¿t ná»‘i Google Ä‘á»ƒ xÃ¡c minh Ä‘Äƒng nháº­p. Vui lÃ²ng thá»­ láº¡i sau.", exception);
        }
    }

    private GoogleIdTokenVerifier getVerifier() throws GeneralSecurityException, IOException {
        GoogleIdTokenVerifier current = verifier;
        if (current == null) {
            synchronized (this) {
                current = verifier;
                if (current == null) {
                    current = new GoogleIdTokenVerifier.Builder(
                            GoogleNetHttpTransport.newTrustedTransport(),
                            GsonFactory.getDefaultInstance())
                            .setAudience(Collections.singletonList(clientId.trim()))
                            .build();
                    verifier = current;
                }
            }
        }
        return current;
    }
}
