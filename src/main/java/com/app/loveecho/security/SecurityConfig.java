package com.app.loveecho.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity  
public class SecurityConfig {

    @Autowired
    private JwtFilter jwtFilter;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> {})
            .csrf(csrf -> csrf.disable())  
            .authorizeHttpRequests(auth -> auth

    // ---------- PUBLIC AUTH ----------
    .requestMatchers("/api/users/login", "/api/users/register").permitAll()
    .requestMatchers(HttpMethod.GET, "/api/users/*").permitAll()

    // ---------- PUBLIC STORY READ ----------
    .requestMatchers(HttpMethod.GET,
            "/api/stories",
            "/api/stories/**"
    ).permitAll()

    // ---------- PROTECTED STORY WRITE ----------
    .requestMatchers(HttpMethod.POST, "/api/stories/**").authenticated()
    .requestMatchers(HttpMethod.PUT, "/api/stories/**").authenticated()
    .requestMatchers(HttpMethod.DELETE, "/api/stories/**").authenticated()
    .requestMatchers(HttpMethod.PATCH, "/api/stories/**").authenticated()

    // ---------- USER PROTECTED ----------
    .requestMatchers("/api/users/me/**").authenticated()

    // Allow spring error dispatcher (VERY IMPORTANT)
    .requestMatchers("/error").permitAll()

    // OPTIONS for mobile apps
    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

    .anyRequest().authenticated()
)

            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            );

        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception {
        AuthenticationManagerBuilder authBuilder = 
            http.getSharedObject(AuthenticationManagerBuilder.class);

        authBuilder
            .userDetailsService(userDetailsService)
            .passwordEncoder(passwordEncoder());

        return authBuilder.build(); // No .and() here
    }


    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
