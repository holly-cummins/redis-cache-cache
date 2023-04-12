package org.acme.hideandseek.places;

/**
 * A place to hide...
 * @param key the key
 * @param name the name
 * @param prefix French grammar, you know...
 * @param description the description
 * @param coordinates the coordinate (lat:long)
 */
public record Place(String key, String name, String prefix, String description, String coordinates) {

}
