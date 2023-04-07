package org.acme.hideandseek;

/**
 * A player
 * @param id the id
 * @param name the name
 * @param picture the picture (url)
 * @param speed the speed (flying is cheating)
 */
public record Player(String id, String name, String picture, int speed) {

    public Player withId(String id) {
        return new Player(id, name, picture, speed);
    }

}
