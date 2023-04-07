package org.acme.hideandseek.places;

/**
 * A place to hide...
 * @param key the key
 * @param name the name
 * @param picture the picture
 * @param description the description
 * @param coordinates the coordinate (lat:long)
 */
public record Place(String key, String name, String picture, String description, String coordinates) {

}
