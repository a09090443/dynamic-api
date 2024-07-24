package com.dynamicapi.enums;

import com.zipe.util.classloader.CustomClassLoader;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

public enum ClassLoaderSingletonEnum {
    INSTANCE;

    private final Map<String, CustomClassLoader> map;

    ClassLoaderSingletonEnum() {
        map = Collections.synchronizedMap(new HashMap<>());
    }

    public Map<String, CustomClassLoader> getMap() {
        return map;
    }

    public void put(String key, CustomClassLoader value) {
        synchronized (this) {
            map.put(key, value);
        }
    }

    public CustomClassLoader get(String key) {
        synchronized (this) {
            return map.get(key);
        }
    }

    public void remove(String key) {
        synchronized (this) {
            map.remove(key);
        }
    }
}
