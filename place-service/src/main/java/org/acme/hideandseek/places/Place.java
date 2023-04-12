package org.acme.hideandseek.places;

/**
 * A place to hide...
 * @param key the key
 * @param name the name
 * @param isPlural whether the name is plural because French, you know...
 * @param description the description
 * @param coordinates the coordinate (lat:long)
 */
public record Place(String key, String name, boolean isPlural, String description, String coordinates) {

}
