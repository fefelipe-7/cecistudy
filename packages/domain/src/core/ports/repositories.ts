import type { EntityId } from '../domain/common';
import type { Workspace } from '../domain';
import type { Document, Relation, CalendarEvent, Project, Output, ContentBase, ChannelVariant, Publication } from '../domain';

/** Repositório genérico de uma agregação do domínio (implementação fica para a Fase 3+). */
export interface Repository<T> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  save(entity: T): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface WorkspaceRepository extends Repository<Workspace> {}
export interface DocumentRepository extends Repository<Document> {}
export interface RelationRepository extends Repository<Relation> {}
export interface EventRepository extends Repository<CalendarEvent> {}
export interface ProjectRepository extends Repository<Project> {}
export interface OutputRepository extends Repository<Output> {}
export interface ContentBaseRepository extends Repository<ContentBase> {}
export interface ChannelVariantRepository extends Repository<ChannelVariant> {}
export interface PublicationRepository extends Repository<Publication> {}

/** Conjunto de repositórios do domínio (a ser resolvido por injeção na Fase 3). */
export interface DomainRepositories {
  workspaces: WorkspaceRepository;
  documents: DocumentRepository;
  relations: RelationRepository;
  events: EventRepository;
  projects: ProjectRepository;
  outputs: OutputRepository;
  contentBases: ContentBaseRepository;
  channelVariants: ChannelVariantRepository;
  publications: PublicationRepository;
}