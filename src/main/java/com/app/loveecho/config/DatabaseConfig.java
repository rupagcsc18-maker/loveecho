package com.app.loveecho.config;

import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;

@Configuration
public class DatabaseConfig {

    @PostConstruct
    public void init() {
        String databaseUrl = System.getenv("DATABASE_URL");

        if (databaseUrl != null && databaseUrl.startsWith("postgres")) {
            databaseUrl = databaseUrl.replace("postgres://", "jdbc:postgresql://")
                                     .replace("postgresql://", "jdbc:postgresql://");

            System.setProperty("SPRING_DATASOURCE_URL", databaseUrl);
            System.out.println("Converted DATABASE_URL to JDBC: " + databaseUrl);
        }
    }
}
