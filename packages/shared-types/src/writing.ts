// Writing DTOs — AI writing review via AiModule

export interface SubmitWritingDto {
  text: string;
}

export interface WritingFeedbackDto {
  feedback: string;
  suggestions: string[];
}
