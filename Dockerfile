# Use Java 21
FROM eclipse-temurin:21-jdk-jammy

WORKDIR /app

# Copy project
COPY . .

# Give permission to maven wrapper
RUN chmod +x mvnw

# Build jar
RUN ./mvnw -DskipTests package

# Expose port
EXPOSE 8080

# Run app
CMD ["java", "-jar", "target/loveecho-0.0.1-SNAPSHOT.jar"]
