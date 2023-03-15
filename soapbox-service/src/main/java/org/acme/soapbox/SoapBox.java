package org.acme.soapbox;

/**
 * Represent a soapbox.
 */
public record SoapBox(String name,
                      String picture,
                      int speed,
                      int robustness) {

    public String id() {
        return toId(name);
    }

    public static String toId(String name) {
        return name.replace(" ", "-");
    }
}
