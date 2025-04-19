
import { Resource } from '../types';

export const groupBySemester = (resources: Resource[]): Record<number, Resource[]> => {
  return resources.reduce((acc, resource) => {
    const semester = resource.semester;
    if (!acc[semester]) {
      acc[semester] = [];
    }
    acc[semester].push(resource);
    return acc;
  }, {} as Record<number, Resource[]>);
};

export const groupBySubject = (resources: Resource[]): Record<string, Resource[]> => {
  return resources.reduce((acc, resource) => {
    const subject = resource.subject;
    if (!acc[subject]) {
      acc[subject] = [];
    }
    acc[subject].push(resource);
    return acc;
  }, {} as Record<string, Resource[]>);
};

export const filterResourcesByTag = (resources: Resource[], tag: string): Resource[] => {
  return resources.filter(resource => resource.category === tag);
};
