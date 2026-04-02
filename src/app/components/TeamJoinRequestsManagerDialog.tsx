import { X } from '@phosphor-icons/react';
import { ROLE_LABEL_MAP } from '../lib/constants';
import { formatDateTime } from '../lib/date';
import { getTeamJoinRequestStatusLabel } from '../lib/presentation';
import { cn } from '../lib/utils';
import { Button } from './Button';
import type { Team, TeamJoinRequest } from '../types/domain';

interface TeamJoinRequestsManagerDialogProps {
  open: boolean;
  team: Team | null;
  requests: TeamJoinRequest[];
  processingId?: string | null;
  onClose: () => void;
  onReview: (requestId: string, status: 'accepted' | 'rejected') => Promise<void> | void;
}

export function TeamJoinRequestsManagerDialog({
  open,
  team,
  requests,
  processingId,
  onClose,
  onReview,
}: TeamJoinRequestsManagerDialogProps) {
  if (!open || !team) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05060B]/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#EEF3F8] px-8 py-6">
          <div>
            <h2 className="text-xl font-bold text-[#0F1E32]">팀 참여 요청 관리</h2>
            <p className="mt-2 text-sm text-[#5F6E82]">
              {team.name}에 도착한 지원 요청을 확인하고 승인 또는 거절할 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl p-2 text-[#5F6E82] transition-colors hover:bg-[#F6F9FC] hover:text-[#0F1E32]"
          >
            <X size={22} />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-8 py-8">
          {requests.length === 0 ? (
            <div className="rounded-2xl bg-[#F6F9FC] px-5 py-6 text-sm text-[#5F6E82]">
              아직 도착한 요청이 없습니다.
            </div>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="rounded-2xl border border-[#EEF3F8] bg-[#F6F9FC] p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="text-lg font-bold text-[#0F1E32]">{request.applicantName}</div>
                    <div className="mt-1 text-sm text-[#5F6E82]">{request.applicantEmail}</div>
                    <div className="mt-3 inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#0F1E32]">
                      {ROLE_LABEL_MAP[request.requestedRole]}
                    </div>
                  </div>
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold',
                      request.status === 'accepted'
                        ? 'bg-[#E8FFF3] text-[#0D8F57]'
                        : request.status === 'pending'
                          ? 'bg-[#EBF5FF] text-[#0064FF]'
                          : 'bg-white text-[#5F6E82]'
                    )}
                  >
                    {getTeamJoinRequestStatusLabel(request.status)}
                  </span>
                </div>

                <div className="mt-4 rounded-2xl bg-white px-4 py-4 text-sm leading-6 text-[#0F1E32]">
                  {request.introMessage}
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs font-medium text-[#5F6E82]">요청 시각 {formatDateTime(request.createdAt)}</div>
                  {request.status === 'pending' ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void onReview(request.id, 'rejected')}
                        disabled={processingId === request.id}
                      >
                        거절
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => void onReview(request.id, 'accepted')}
                        disabled={processingId === request.id}
                      >
                        승인
                      </Button>
                    </div>
                  ) : (
                    <div className="text-xs font-medium text-[#5F6E82]">
                      {request.reviewedAt ? `처리 시각 ${formatDateTime(request.reviewedAt)}` : '처리 완료'}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
