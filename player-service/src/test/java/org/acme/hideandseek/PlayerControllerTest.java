package org.acme.hideandseek;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.common.mapper.TypeRef;
import org.junit.jupiter.api.Test;

import java.util.List;

import static io.restassured.RestAssured.delete;
import static io.restassured.RestAssured.get;
import static io.restassured.RestAssured.with;
import static org.hamcrest.Matchers.equalTo;
import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
class PlayerControllerTest {

    @Test
    void getAll() {
        List<Player> list = get("/")
                .then()
                .statusCode(200)
                .extract().response().as(new TypeRef<List<Player>>() {
                });
        assertEquals(3, list.size());
    }

    @Test
    void getOne() {
        // Match
        var found = get("/a5b6e9d7-8c6d-4a5d-9b7f-1a7d5a8f8e9e")// frogman
                .then().statusCode(200)
                .extract().response().as(Player.class);
        assertNotNull(found);
        assertEquals("frogman", found.name());
        // Miss
        get("/missing")
                .then().statusCode(404);
    }

    @Test
    void createAndDelete() {
        Player test = new Player(null, "test", "", 99);
        Player added = with().body(test)
                .header("Content-Type", "application/json")
                .post("/")
                .then()
                .statusCode(201)
                .body("name", equalTo("test"))
                .body("speed", equalTo(99))
                .extract().as(Player.class);

        List<Player> list = get("/")
                .then()
                .statusCode(200)
                .extract().response().as(new TypeRef<List<Player>>() {
                });
        assertEquals(4, list.size());


        get("/" + added.id())
                .then().statusCode(200)
                .body("name", equalTo("test"))
                .body("speed", equalTo(99));

        delete("/" + added.id())
                .then().statusCode(204);

        list = get("/")
                .then()
                .statusCode(200)
                .extract().response().as(new TypeRef<List<Player>>() {
                });
        assertEquals(3, list.size());

        get("/" + added.id())
                .then().statusCode(404);

        delete("/" + added.id())
                .then().statusCode(404);

        // Cannot create if id is already there.
        Player bad = new Player("a5b6e9d7-8c6d-4a5d-9b7f-1a7d5a8f8e9e", "bad", "", 99);
        with().body(bad)
                .header("Content-Type", "application/json")
                .post("/")
                .then()
                .statusCode(400);
    }


    @Test
    void update() {
        Player test = new Player(null, "test", "", 20);
        var added = with().body(test)
                .header("Content-Type", "application/json")
                .post("/")
                .then().statusCode(201)
                .extract().as(Player.class);

        Player updated = new Player(added.id(), "test", "", 98);
        var stored = with().body(updated)
                .header("Content-Type", "application/json")
                .put("/" + added.id())
                .then().statusCode(200)
                .extract().response().as(Player.class);
        assertEquals(98, stored.speed());
        assertEquals("test", stored.name());

        delete("/" + added.id()).then().statusCode(204);

        // Update missing
        Player missing = new Player("missing", "missing", "", 20);
        with().body(missing)
                .header("Content-Type", "application/json")
                .put("/missing")
                .then().statusCode(404);
    }
}