package com.arpay.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

/**
 * Web MVC Configuration for serving the React frontend
 * This allows the Spring Boot backend to serve the frontend static files
 * and handle SPA routing (Single Page Application)
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    /**
     * Configure static resource handlers
     * Serves static files from /static directory and handles SPA routing
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve static resources (JS, CSS, images, etc.)
        registry.addResourceHandler("/assets/**")
                .addResourceLocations("classpath:/static/assets/");

        registry.addResourceHandler("/favicon.ico")
                .addResourceLocations("classpath:/static/favicon.ico");

        registry.addResourceHandler("/placeholder.svg")
                .addResourceLocations("classpath:/static/placeholder.svg");

        registry.addResourceHandler("/robots.txt")
                .addResourceLocations("classpath:/static/robots.txt");

        // Handle SPA routing - serve index.html for all non-API routes
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        Resource requestedResource = location.createRelative(resourcePath);

                        // If the resource exists, serve it
                        if (requestedResource.exists() && requestedResource.isReadable()) {
                            return requestedResource;
                        }

                        // Otherwise, serve index.html for SPA routing (React Router)
                        // But only if the path doesn't start with /api
                        if (!resourcePath.startsWith("api/")) {
                            return new ClassPathResource("/static/index.html");
                        }

                        return null;
                    }
                });
    }

    /**
     * Add view controllers for root path
     */
    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // Forward root to index.html
        registry.addViewController("/").setViewName("forward:/index.html");
    }
}

