'use client';

import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Build as BuildIcon,
  Code as CodeIcon,
  Storage as StorageIcon,
  Web as WebIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

const AboutPage: React.FC = () => {
  const techStack = [
    { name: 'Next.js 15', category: '前端框架', color: 'primary' },
    { name: 'React 18', category: '前端函式庫', color: 'primary' },
    { name: 'TypeScript', category: '程式語言', color: 'secondary' },
    { name: 'Material-UI', category: 'UI 元件庫', color: 'info' },
    { name: 'React Hook Form', category: '表單管理', color: 'success' },
    { name: 'Axios', category: 'HTTP 客戶端', color: 'warning' }
  ];

  const features = [
    {
      icon: <WebIcon />,
      title: 'Endpoint 管理',
      description: '管理 Web Service Endpoint，支援動態載入、啟用/停用狀態切換'
    },
    {
      icon: <CodeIcon />,
      title: 'Restful API 管理',
      description: '管理 RESTful Controller，支援動態註冊和管理'
    },
    {
      icon: <StorageIcon />,
      title: 'Response 管理',
      description: '管理 Mock Response 資料，支援條件式回應內容設定'
    },
    {
      icon: <BuildIcon />,
      title: 'WSDL 工具',
      description: '支援從 WSDL 檔案或 URL 生成 Java 物件，並提供下載功能'
    },
    {
      icon: <SecurityIcon />,
      title: '檔案上傳',
      description: '支援 JAR 檔案上傳，用於動態載入服務類別'
    }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        關於 Dynamic API Manager
      </Typography>
      
      <Typography variant="h6" color="textSecondary" paragraph>
        一個基於 Next.js 的動態 API 管理系統
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {/* 系統概述 */}
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              系統概述
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Dynamic API Manager 是一個用於管理動態 API 服務的 Web 應用程式。
              系統主要負責 Endpoint 和 RESTful 服務的管理，以及相應的回應內容設定。
            </Typography>
            <Typography variant="body2" color="textSecondary">
              該系統支援動態載入 JAR 檔案、Web Service 端點管理、RESTful Controller 管理，
              以及 Mock Response 資料管理等功能。
            </Typography>
          </CardContent>
        </Card>

        {/* 技術架構 */}
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              技術架構
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {techStack.map((tech, index) => (
                <Chip
                  key={index}
                  label={tech.name}
                  color={tech.color as 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error'}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              採用現代化的前端技術架構，提供響應式設計和良好的使用者體驗。
            </Typography>
          </CardContent>
        </Card>

        {/* 主要功能 */}
        <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                主要功能
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                {features.map((feature, index) => (
                  <ListItem key={index}>
                    <ListItemIcon sx={{ color: 'primary.main' }}>
                      {feature.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={feature.title}
                      secondary={feature.description}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>

        {/* 版本資訊 */}
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              版本資訊
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <strong>版本:</strong> 2.0.0
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <strong>建立日期:</strong> {new Date().toLocaleDateString('zh-TW')}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <strong>技術架構:</strong> Next.js + TypeScript
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <strong>UI 框架:</strong> Material-UI (MUI)
            </Typography>
          </CardContent>
        </Card>

        {/* 開發資訊 */}
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              開發資訊
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <strong>原始架構:</strong> Angular 17
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <strong>重構為:</strong> Next.js 15
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <strong>狀態管理:</strong> React Hooks + Axios
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <strong>樣式方案:</strong> Material-UI + Emotion
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default AboutPage;