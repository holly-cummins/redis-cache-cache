package org.acme.hideandseek.places;

import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.search.CreateArgs;
import io.quarkus.redis.datasource.search.FieldType;
import io.quarkus.runtime.Startup;

/**
 * Creates the index if not yet there.
 */
@Startup
public class IndexManager {

    public static final String INDEX_NAME = "hide-and-seek:places-index";

    public IndexManager(RedisDataSource redis) {
        // FT.CREATE  ON JSON PREFIX 1 hide-and-seek:places: SCHEMA $.name AS name TEXT $.description as description TEXT $.coordinates AS coordinates GEO
        if (!redis.search().ft_list().contains(INDEX_NAME)) {
            redis.search().ftCreate(INDEX_NAME, new CreateArgs()
                    .onJson()
                    .prefixes("hide-and-seek:places:")
                    .indexedField("$.name", "name", FieldType.TEXT)
                    .indexedField("$.description", "description", FieldType.TEXT)
                    .indexedField("$.coordinates", "coordinates", FieldType.GEO)
            );
        }
    }

}
