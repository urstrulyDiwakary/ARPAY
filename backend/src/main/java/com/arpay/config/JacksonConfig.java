package com.arpay.config;

import com.arpay.entity.Invoice;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;
import com.fasterxml.jackson.databind.module.SimpleModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

import java.io.IOException;

@Configuration
public class JacksonConfig {

    /**
     * Custom deserializer for InvoiceStatus to handle case-insensitive input
     */
    public static class InvoiceStatusDeserializer extends StdDeserializer<Invoice.InvoiceStatus> {
        public InvoiceStatusDeserializer() {
            super(Invoice.InvoiceStatus.class);
        }

        @Override
        public Invoice.InvoiceStatus deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
            String value = p.getText();
            if (value == null || value.isEmpty()) {
                return null;
            }
            try {
                return Invoice.InvoiceStatus.valueOf(value.toUpperCase());
            } catch (IllegalArgumentException e) {
                ctxt.reportInputMismatch(Invoice.InvoiceStatus.class,
                        "Invalid invoice status: " + value + ". Valid values are: PENDING, PAID, OVERDUE, PARTIAL");
                return null;
            }
        }
    }

    /**
     * Custom deserializer for InvoiceType to handle case-insensitive input
     */
    public static class InvoiceTypeDeserializer extends StdDeserializer<Invoice.InvoiceType> {
        public InvoiceTypeDeserializer() {
            super(Invoice.InvoiceType.class);
        }

        @Override
        public Invoice.InvoiceType deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
            String value = p.getText();
            if (value == null || value.isEmpty()) {
                return null;
            }
            try {
                return Invoice.InvoiceType.valueOf(value.toUpperCase());
            } catch (IllegalArgumentException e) {
                ctxt.reportInputMismatch(Invoice.InvoiceType.class,
                        "Invalid invoice type: " + value + ". Valid values are: PROJECT, CUSTOMER, EXPENSE");
                return null;
            }
        }
    }

    @Bean
    public ObjectMapper objectMapper(Jackson2ObjectMapperBuilder builder) {
        ObjectMapper mapper = builder.build();

        // Enable case-insensitive enum deserialization
        mapper.enable(DeserializationFeature.READ_ENUMS_USING_TO_STRING);
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        // Register custom deserializers
        SimpleModule module = new SimpleModule();
        module.addDeserializer(Invoice.InvoiceStatus.class, new InvoiceStatusDeserializer());
        module.addDeserializer(Invoice.InvoiceType.class, new InvoiceTypeDeserializer());
        mapper.registerModule(module);

        return mapper;
    }
}
