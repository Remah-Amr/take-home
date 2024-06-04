export interface IMessage {
  id: string;
  subject: string;
  bodyPreview: string;
  isRead: string;
  from: {
    name: string;
    email: string;
  };
  to: {
    name: string;
    email: string;
  };
  createdDateTime: Date;
  lastModifiedDateTime: Date;
}
