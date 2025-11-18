import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { 
  MessageCircle, 
  Mail, 
  MailOpen, 
  Clock, 
  Send, 
  CheckCircle 
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { GlassPageLayout } from "@/components/GlassPageLayout";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Questions() {
  const { user } = useAuth();
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  const { data: questions, refetch: refetchQuestions } = trpc.messages.listQuestions.useQuery();
  const { data: replies, refetch: refetchReplies } = trpc.messages.getQuestionReplies.useQuery(
    { questionId: selectedQuestion! },
    { enabled: !!selectedQuestion }
  );

  const markAsReadMutation = trpc.messages.markQuestionAsRead.useMutation();
  const replyMutation = trpc.messages.replyToQuestion.useMutation();

  const handleSelectQuestion = async (questionId: number) => {
    setSelectedQuestion(questionId);
    setReplyMessage("");

    const question = questions?.find(q => q.id === questionId);
    if (question?.isUnread) {
      await markAsReadMutation.mutateAsync({ questionId });
      refetchQuestions();
    }
  };

  const handleReply = async () => {
    if (!selectedQuestion || !replyMessage.trim()) {
      toast.error("Please enter a reply message");
      return;
    }

    try {
      await replyMutation.mutateAsync({
        questionId: selectedQuestion,
        message: replyMessage.trim(),
      });

      toast.success("Reply sent successfully!");
      setReplyMessage("");
      refetchReplies();
      refetchQuestions();
    } catch (error: any) {
      toast.error(error.message || "Failed to send reply");
    }
  };

  const isAdminOrPrimary = user?.role === "admin" || user?.role === "primary";

  if (!isAdminOrPrimary) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-foreground/80">You don't have permission to view this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  const selectedQuestionData = questions?.find(q => q.id === selectedQuestion);

  return (
    <DashboardLayout>
      <GlassPageLayout
        title="Questions & Messages"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Questions List */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-sm font-semibold text-foreground/80 mb-3">
              All Questions ({questions?.length || 0})
            </h3>
            
            {questions && questions.length === 0 && (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Mail className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">No questions yet</p>
                </CardContent>
              </Card>
            )}

            {questions?.map((question) => (
              <Card
                key={question.id}
                className={`cursor-pointer transition-all ${
                  selectedQuestion === question.id
                    ? "bg-white/20 border-[#6BC4B8]/50"
                    : "bg-white/10 hover:bg-white/15"
                } backdrop-blur-sm border-white/20`}
                onClick={() => handleSelectQuestion(question.id)}
              >
                <CardHeader className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-semibold line-clamp-2 mb-1">
                        {question.title}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        From: {question.authorName}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {question.isUnread ? (
                        <Badge variant="default" className="bg-[#6BC4B8] text-white text-xs">
                          <Mail className="w-3 h-3 mr-1" />
                          New
                        </Badge>
                      ) : (
                        <MailOpen className="w-4 h-4 text-muted-foreground" />
                      )}
                      {question.replyCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {question.replyCount} {question.replyCount === 1 ? "reply" : "replies"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                    <Clock className="w-3 h-3" />
                    {new Date(question.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Question Detail & Reply */}
          <div className="lg:col-span-2">
            {selectedQuestionData ? (
              <div className="space-y-4">
                {/* Question Detail */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                          {selectedQuestionData.title}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span>From: {selectedQuestionData.authorName}</span>
                          {selectedQuestionData.authorEmail && (
                            <span className="text-xs">({selectedQuestionData.authorEmail})</span>
                          )}
                          <span>•</span>
                          <span>
                            {new Date(selectedQuestionData.createdAt).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {selectedQuestionData.questionContext && (
                          <Badge variant="outline" className="mt-2">
                            About: {selectedQuestionData.questionContext}
                            {selectedQuestionData.questionContextId && ` #${selectedQuestionData.questionContextId}`}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="whitespace-pre-wrap text-foreground">
                      {selectedQuestionData.body}
                    </div>
                  </CardContent>
                </Card>

                {/* Replies */}
                {replies && replies.length > 0 && (
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardHeader>
                      <CardTitle className="text-base">Replies ({replies.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {replies.map((reply) => (
                        <div
                          key={reply.id}
                          className="p-3 rounded-lg bg-white/10 border border-white/10"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-foreground">
                                {reply.authorName}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {reply.authorRole}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(reply.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground whitespace-pre-wrap">
                            {reply.message}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Reply Form */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-base">Send a Reply</CardTitle>
                    <CardDescription>
                      Your reply will be sent to {selectedQuestionData.authorName} via email notification
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your response here..."
                      rows={6}
                      className="resize-none"
                      disabled={replyMutation.isPending}
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={handleReply}
                        disabled={replyMutation.isPending || !replyMessage.trim()}
                        className="bg-[#6BC4B8] hover:bg-[#5AB3A8] text-white"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {replyMutation.isPending ? "Sending..." : "Send Reply"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="flex flex-col items-center justify-center py-24">
                  <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Select a question to view details and reply
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </GlassPageLayout>
    </DashboardLayout>
  );
}
