import request from '@/utils/request';

export const selectedMeasurePointsApi = (params: {
  ids: string[];
  names: string[];
  workConditionId?: number;
  testType?: string;
}) => {
  return request({
    url: '/api/virtual-real/selected-measure-points',
    method: 'post',
    data: params
  });
};

// src/api/measurePoints.ts
export const getMeasurePointsConfig = () => {
  return request({
    url: '/api/virtual-real/measure-points/config',
    method: 'get'
  });
};


