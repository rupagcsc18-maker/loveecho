package com.app.loveecho;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

@SpringBootApplication
@EnableMongoAuditing
public class LoveechoApplication {

    public static void main(String[] args) {

        // --- Convert Render DATABASE_URL to JDBC format ---
        String databaseUrl = System.getenv("DATABASE_URL");

        if (databaseUrl != null && databaseUrl.startsWith("postgres")) {

            // postgres://user:pass@host:5432/db
            databaseUrl = databaseUrl
                    .replace("postgres://", "jdbc:postgresql://")
                    .replace("postgresql://", "jdbc:postgresql://");

            System.setProperty("SPRING_DATASOURCE_URL", databaseUrl);

            System.out.println("Converted DATABASE_URL -> " + databaseUrl);
        }

        SpringApplication.run(LoveechoApplication.class, args);
    }
}
