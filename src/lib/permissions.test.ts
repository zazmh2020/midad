import { describe, it, expect } from 'vitest';
import {
  canViewTasks, canManageTasks, isTaskStatus, isTaskPriority,
  canViewRequests, canManageRequests,
  canManageFees, canViewEvents, canManageEvents,
  isRequestStatus, isRequestType,
} from './permissions';

describe('task permissions', () => {
  it('members can view, staff/admin can manage', () => {
    expect(canViewTasks('MEMBER')).toBe(true);
    expect(canManageTasks('MEMBER')).toBe(false);
    expect(canManageTasks('STAFF')).toBe(true);
    expect(canManageTasks('ORG_ADMIN')).toBe(true);
  });
  it('rejects unknown roles', () => {
    expect(canViewTasks('HACKER')).toBe(false);
    expect(canManageTasks('')).toBe(false);
  });
  it('validates task status/priority enums', () => {
    expect(isTaskStatus('TODO')).toBe(true);
    expect(isTaskStatus('DONE')).toBe(true);
    expect(isTaskStatus('DROP TABLE')).toBe(false);
    expect(isTaskPriority('URGENT')).toBe(true);
    expect(isTaskPriority('nope')).toBe(false);
  });
});

describe('request permissions', () => {
  it('only org admins approve/reject; all members submit', () => {
    expect(canViewRequests('MEMBER')).toBe(true);
    expect(canManageRequests('STAFF')).toBe(false);
    expect(canManageRequests('ORG_ADMIN')).toBe(true);
  });
  it('validates request enums', () => {
    expect(isRequestStatus('APPROVED')).toBe(true);
    expect(isRequestStatus('MAYBE')).toBe(false);
    expect(isRequestType('EXAM')).toBe(true);
    expect(isRequestType('xxx')).toBe(false);
  });
});

describe('events & fees permissions', () => {
  it('staff/admin manage, members view events', () => {
    expect(canViewEvents('MEMBER')).toBe(true);
    expect(canManageEvents('MEMBER')).toBe(false);
    expect(canManageEvents('STAFF')).toBe(true);
    expect(canManageFees('ORG_ADMIN')).toBe(true);
    expect(canManageFees('MEMBER')).toBe(false);
  });
});
