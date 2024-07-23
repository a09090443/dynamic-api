package com.dynamicapi.jdbc;

import com.zipe.jdbc.BaseJDBC;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

@Slf4j
@Repository
public class ControllerJDBC extends BaseJDBC {

    public static final String SQL_SELECT_CONTROLLER_RELATED_JAR_FILE = "SQL_SELECT_CONTROLLER_RELATED_JAR_FILE";

}
