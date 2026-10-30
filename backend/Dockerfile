FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

RUN mkdir -p /data/sqlite /data/jars /data/logs

COPY build/libs/backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
