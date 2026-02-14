package com.app.loveecho;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

import java.net.URI;

@SpringBootApplication
@EnableMongoAuditing
public class LoveechoApplication {

    public static void main(String[] args) {

        try {
            String databaseUrl = System.getenv("DATABASE_URL");

            if (databaseUrl != null && databaseUrl.startsWith("postgres")) {

                URI uri = new URI(databaseUrl);

                String[] userInfo = uri.getUserInfo().split(":");
                String username = userInfo[0];
                String password = userInfo[1];

                String host = uri.getHost();
                int port = (uri.getPort() == -1) ? 5432 : uri.getPort();
                String database = uri.getPath();

                String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + database +
                        "?user=" + username +
                        "&password=" + password +
                        "&sslmode=require";

                System.setProperty("SPRING_DATASOURCE_URL", jdbcUrl);

                System.out.println("✅ JDBC URL GENERATED: " + jdbcUrl);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        SpringApplication.run(LoveechoApplication.class, args);
    }
}
