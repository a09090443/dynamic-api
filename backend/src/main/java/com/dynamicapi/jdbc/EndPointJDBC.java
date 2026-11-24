package com.dynamicapi.jdbc;

import com.dynamicapi.model.WebServiceModel;
import com.zipe.jdbc.BaseJDBC;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.stereotype.Repository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Repository
public class EndPointJDBC extends BaseJDBC {

    public static final String SQL_SELECT_ENDPOINT_RELATED_JAR_FILE = "SQL_SELECT_ENDPOINT_RELATED_JAR_FILE";

    private static final String CONDITIONS_PLACEHOLDER = "${CONDITIONS}";

    private final NamedSqlLoader namedSqlLoader;

    public EndPointJDBC(NamedSqlLoader namedSqlLoader) {
        this.namedSqlLoader = namedSqlLoader;
    }

    /**
     * 查詢全部 Endpoint（含 JAR 檔資訊）。
     */
    public List<WebServiceModel> findAll() {
        String sql = namedSqlLoader.get(SQL_SELECT_ENDPOINT_RELATED_JAR_FILE).replace(CONDITIONS_PLACEHOLDER, "");
        return this.support.getNamedParameterJdbcTemplate()
                .query(sql, Map.of(), new BeanPropertyRowMapper<>(WebServiceModel.class));
    }

    /**
     * 依 id、publishUri（皆可空白）查詢單筆 Endpoint；查無資料時回傳 null。
     */
    public WebServiceModel findOne(String id, String publishUri) {
        StringBuilder conditions = new StringBuilder();
        Map<String, Object> params = new HashMap<>();
        if (StringUtils.isNotBlank(id)) {
            conditions.append(" AND e.ID = :id");
            params.put("id", id);
        }
        if (StringUtils.isNotBlank(publishUri)) {
            conditions.append(" AND e.PUBLISH_URI = :publishUri");
            params.put("publishUri", publishUri);
        }
        String sql = namedSqlLoader.get(SQL_SELECT_ENDPOINT_RELATED_JAR_FILE)
                .replace(CONDITIONS_PLACEHOLDER, conditions.toString());
        List<WebServiceModel> list = this.support.getNamedParameterJdbcTemplate()
                .query(sql, params, new BeanPropertyRowMapper<>(WebServiceModel.class));
        return list.isEmpty() ? null : list.get(0);
    }

}
