import io.quarkus.test.junit.QuarkusTest;
import io.restassured.common.mapper.TypeRef;
import org.acme.hideandseek.places.Place;
import org.junit.jupiter.api.Test;

import java.util.List;

import static io.restassured.RestAssured.get;
import static io.restassured.RestAssured.with;
import static org.hamcrest.Matchers.equalTo;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@QuarkusTest
class PlaceControllerTest {

    @Test
    void getAll() {
        List<Place> list = get("/places")
                .then()
                .statusCode(200)
                .extract().response().as(new TypeRef<>() {
                });
        assertEquals(16, list.size());
    }

    @Test
    void search() {
        List<Place> list = get("/places/search?query=old")
                .then()
                .statusCode(200)
                .extract().response().as(new TypeRef<>() {
                });
        assertEquals(3, list.size());

        list = get("/places/search?query=brouette")
                .then()
                .statusCode(200)
                .extract().response().as(new TypeRef<>() {
                });
        assertEquals(0, list.size());
    }


}