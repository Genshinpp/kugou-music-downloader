// src/contexts/SearchContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { message } from 'antd';

const SearchContext = createContext();

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

export const SearchProvider = ({ children }) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback((keyword) => {
    if (!keyword?.trim()) {
      message.warning('请输入搜索关键词');
      return;
    }
    
    setSearchKeyword(keyword.trim());
    setIsSearching(true);
    // 搜索状态由使用搜索结果的组件来控制
  }, []);

  const clearSearch = useCallback(() => {
    setSearchKeyword('');
    setIsSearching(false);
  }, []);

  const finishSearch = useCallback(() => {
    setIsSearching(false);
  }, []);

  const value = {
    searchKeyword,
    isSearching,
    handleSearch,
    clearSearch,
    finishSearch,
    setSearchKeyword
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};