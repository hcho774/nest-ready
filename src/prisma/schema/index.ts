import { UserRelations as _UserRelations } from './user_relations';
import { User as _User } from './user';

export namespace PrismaModel {
  export class UserRelations extends _UserRelations {}
  export class User extends _User {}

  export const extraModels = [UserRelations, User];
}
