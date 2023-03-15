package org.acme.soapbox;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.common.mapper.TypeRef;
import org.junit.jupiter.api.Test;

import java.util.List;

import static io.restassured.RestAssured.delete;
import static io.restassured.RestAssured.get;
import static io.restassured.RestAssured.with;
import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
class SoapBoxResourceTest {

    @Test
    void testAll() {
        List<SoapBox> list = get("/")
                .then()
                .statusCode(200)
                .extract().response().as(new TypeRef<List<SoapBox>>() {
                });
        assertEquals(3, list.size());
    }

    @Test
    void testOne() {
        // Match
        var found = get("/shark")
                .then().statusCode(200)
                .extract().response().as(SoapBox.class);
        assertNotNull(found);
        assertEquals("shark", found.name());
        // Miss
        get("/missing")
                .then().statusCode(404);
    }

    @Test
    void testCreateAndDelete() {
        SoapBox test = new SoapBox("test", "", 20, 20);
        with().body(test)
                .header("Content-Type", "application/json")
                .post("/")
                .then().statusCode(201);

        List<SoapBox> list = get("/")
                .then()
                .statusCode(200)
                .extract().response().as(new TypeRef<List<SoapBox>>() {
                });
        assertEquals(4, list.size());


        var found = get("/test")
                .then().statusCode(200)
                .extract().response().as(SoapBox.class);
        assertNotNull(found);
        assertEquals("test", found.name());

        delete("/test")
                .then().statusCode(204);

        list = get("/")
                .then()
                .statusCode(200)
                .extract().response().as(new TypeRef<List<SoapBox>>() {
                });
        assertEquals(3, list.size());

        get("/test")
                .then().statusCode(404);

        delete("/test")
                .then().statusCode(404);
    }

    @Test
    void testUpdate() {
        SoapBox test = new SoapBox("test", "", 20, 20);
        with().body(test)
                .header("Content-Type", "application/json")
                .post("/")
                .then().statusCode(201);

        SoapBox updated = new SoapBox("test", "", 30, 30);
        var stored = with().body(updated)
                .header("Content-Type", "application/json")
                .put("/test")
                .then().statusCode(200)
                .extract().response().as(SoapBox.class);
        assertEquals(30, stored.speed());
        assertEquals(30, stored.robustness());
        assertEquals("test", stored.name());

        // Update the name
        updated = new SoapBox("foo", "", 30, 30);
        stored = with().body(updated)
                .header("Content-Type", "application/json")
                .put("/test")
                .then().statusCode(200)
                .extract().response().as(SoapBox.class);
        assertEquals(30, stored.speed());
        assertEquals(30, stored.robustness());
        assertEquals("foo", stored.name());

        var found = get("/foo")
                .then().statusCode(200)
                .extract().response().as(SoapBox.class);
        assertNotNull(found);
        assertEquals("foo", found.name());

        get("/test")
                .then().statusCode(404);

        // Update missing
        SoapBox missing = new SoapBox("missing", "", 20, 20);
        with().body(missing)
                .header("Content-Type", "application/json")
                .put("/missing")
                .then().statusCode(404);
    }
}