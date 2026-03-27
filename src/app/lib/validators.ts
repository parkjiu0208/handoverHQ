import { z } from 'zod';
import { isGitHubRepositoryUrl, isValidExternalUrl } from './url';
import { roleValues } from '../types/domain';

export const authRequestSchema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력해주세요.'),
  displayName: z.string().trim().min(2, '이름은 2자 이상이어야 합니다.').max(20, '이름은 20자 이하로 입력해주세요.'),
  primaryRole: z.enum(roleValues).nullable(),
});

export const teamFormSchema = z
  .object({
    id: z.string().optional(),
    hackathonId: z.string().min(1, '해커톤을 선택해주세요.'),
    name: z.string().trim().min(2, '팀 이름은 2자 이상이어야 합니다.').max(40, '팀 이름은 40자 이하로 입력해주세요.'),
    description: z.string().trim().min(20, '팀 소개는 20자 이상 입력해주세요.').max(300, '팀 소개는 300자 이하로 입력해주세요.'),
    currentSize: z.coerce.number().int().min(1, '현재 인원은 1명 이상이어야 합니다.').max(10, '현재 인원은 10명 이하로 입력해주세요.'),
    maxSize: z.coerce.number().int().min(2, '최대 인원은 2명 이상이어야 합니다.').max(10, '최대 인원은 10명 이하로 입력해주세요.'),
    isRecruiting: z.boolean(),
    desiredRoles: z.array(z.enum(roleValues)).min(1, '모집 직군을 한 개 이상 선택해주세요.'),
    techTags: z.array(z.string()).max(5, '기술 태그는 최대 5개까지 입력할 수 있습니다.'),
    contactUrl: z.string().trim().refine(isValidExternalUrl, '연락 링크는 http 또는 https URL이어야 합니다.'),
  })
  .refine((value) => value.currentSize <= value.maxSize, {
    message: '현재 인원은 최대 인원을 초과할 수 없습니다.',
    path: ['currentSize'],
  });

export const submissionFormSchema = z.object({
  hackathonId: z.string().min(1),
  teamId: z.string().min(1),
  proposalSummary: z.string().trim().min(20, '프로젝트 요약은 20자 이상 입력해주세요.').max(400, '프로젝트 요약은 400자 이하로 입력해주세요.'),
  proposalUrl: z.string().trim().refine(isValidExternalUrl, '기획서 링크는 유효한 URL이어야 합니다.'),
  deployUrl: z.string().trim().refine(isValidExternalUrl, '배포 URL은 유효한 URL이어야 합니다.'),
  githubUrl: z.string().trim().refine(isGitHubRepositoryUrl, 'GitHub 저장소 URL은 github.com 저장소 주소여야 합니다.'),
  solutionPdfUrl: z.string().trim(),
  solutionPdfPath: z.string().trim(),
  demoVideoUrl: z.string().trim().refine((value) => value.length === 0 || isValidExternalUrl(value), '시연 링크는 비워두거나 유효한 URL이어야 합니다.'),
}).refine((value) => value.solutionPdfPath.length > 0 || isValidExternalUrl(value.solutionPdfUrl), {
  message: '솔루션 PDF는 업로드하거나 유효한 공개 URL을 입력해주세요.',
  path: ['solutionPdfUrl'],
});
