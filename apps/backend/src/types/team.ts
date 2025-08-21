import { Team, Game } from '@prisma/client';

export interface CreateTeamData {
  name: string;
  shortName: string;
  description?: string;
  avatar?: string;
  game: Game;
  gameMode: string;
  ownerId: string;
}

export interface UpdateTeamData {
  name?: string;
  shortName?: string;
  description?: string;
  avatar?: string;
  game?: Game;
  gameMode?: string;
}

export interface TeamWithOwner extends Team {
  owner: {
    id: string;
    pseudo: string;
    avatar?: string;
    discordAvatar?: string;
  };
}

export interface TeamResponse {
  success: boolean;
  data?: TeamWithOwner | TeamWithOwner[];
  message?: string;
}