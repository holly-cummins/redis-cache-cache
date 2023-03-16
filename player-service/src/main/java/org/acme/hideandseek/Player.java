package org.acme.hideandseek;

public record Player(String id, String name, String picture, int speed) {

    public Player withId(String id) {
        return new Player(id, name, picture, speed);
    }

}
