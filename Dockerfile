# Use Java 21
FROM eclipse-temurin:21-jdk-jammy

# Set working directory
WORKDIR /app

# Copy project
COPY . .

# Build project
RUN ./mvnw -DskipTests package

# Expose port
EXPOSE 8080

# Run application
CMD ["java", "-jar", "target/loveecho-0.0.1-SNAPSHOT.jar"]
