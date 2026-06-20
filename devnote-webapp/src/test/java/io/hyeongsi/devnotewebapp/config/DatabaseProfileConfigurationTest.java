package io.hyeongsi.devnotewebapp.config;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;

class DatabaseProfileConfigurationTest {

    @Test
    void defaultProfileIsLocal() throws IOException {
        Properties properties = loadProperties("application.properties");

        assertThat(properties.getProperty("spring.profiles.default"))
                .isEqualTo("local");
    }

    @Test
    void localProfileUsesAnH2MemoryDatabase() throws IOException {
        Properties properties = loadProperties("application-local.properties");

        assertThat(properties.getProperty("spring.datasource.url"))
                .startsWith("jdbc:h2:mem:");
        assertThat(properties.getProperty("spring.datasource.driver-class-name"))
                .isEqualTo("org.h2.Driver");
        assertThat(properties.getProperty("spring.jpa.hibernate.ddl-auto"))
                .isEqualTo("create-drop");
        assertThat(properties.getProperty("spring.sql.init.mode"))
                .isEqualTo("always");
    }

    @Test
    void testProfileUsesAnIsolatedH2Database() throws IOException {
        Properties properties = loadProperties("application-test.properties");

        assertThat(properties.getProperty("spring.datasource.url"))
                .startsWith("jdbc:h2:mem:");
        assertThat(properties.getProperty("spring.datasource.driver-class-name"))
                .isEqualTo("org.h2.Driver");
        assertThat(properties.getProperty("spring.jpa.hibernate.ddl-auto"))
                .isEqualTo("create-drop");
        assertThat(properties.getProperty("spring.sql.init.encoding"))
                .isEqualTo("UTF-8");
    }

    @Test
    void productionProfileUsesEnvironmentConfiguredMySql() throws IOException {
        Properties properties = loadProperties("application-prod.properties");

        assertThat(properties.getProperty("spring.datasource.url"))
                .startsWith("jdbc:mysql://${DB_HOST}:${DB_PORT:3306}/${DB_NAME}");
        assertThat(properties.getProperty("spring.datasource.username"))
                .isEqualTo("${DB_USERNAME}");
        assertThat(properties.getProperty("spring.datasource.password"))
                .isEqualTo("${DB_PASSWORD}");
        assertThat(properties.getProperty("spring.jpa.hibernate.ddl-auto"))
                .isEqualTo("update");
        assertThat(properties.getProperty("spring.sql.init.mode"))
                .isEqualTo("never");
    }

    private Properties loadProperties(String resourceName) throws IOException {
        Properties properties = new Properties();
        try (InputStream input = getClass().getClassLoader().getResourceAsStream(resourceName)) {
            assertThat(input)
                    .as("classpath resource %s", resourceName)
                    .isNotNull();
            properties.load(input);
        }
        return properties;
    }
}
