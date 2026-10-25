import React from 'react';
import { motion } from 'framer-motion';

interface SharedElementProps {
  /** Id de escopo (`note-<id>`). Prefixo é obrigatório: `layoutId` global colide. */
  id: string;
  className?: string;
  /** Estilo inline do elemento (cor de dado, gradiente). O morph não interpola isso. */
  style?: React.CSSProperties;
  children: React.ReactNode;
}

/**
 * O elemento que viaja entre origem e destino (SPEC-M-027 D4, D21).
 *
 * **O fallback é a ausência de par.** Com `layoutId` e nenhuma outra instância
 * montada, o Motion desenha o elemento no lugar e não anima — a camada de
 * overlay faz o fade dela. Não existe "zoom do nada", que foi o bug B3 da
 * SPEC-007. Por isso o componente não precisa perguntar se a origem existe: se
 * ela não existe, não há par e não há animação.
 */
export const SharedElement: React.FC<SharedElementProps> = ({ id, className, style, children }) => (
  <motion.div layoutId={id} data-shared-element={id} className={className} style={style}>
    {children}
  </motion.div>
);

/**
 * Prefixo do par nota ↔ detalhe da nota. Origem e destino chamam **esta**
 * função: dois literais `note-${id}` em arquivos diferentes é como o par
 * deixaria de casar sem ninguém notar.
 */
export const sharedNoteId = (noteId: string): string => `note-${noteId}`;

/**
 * Prefixo do par card da grade ↔ capinha do detalhe da disciplina (SPEC-M-027
 * D4). Mesmo motivo do de nota: origem (`DisciplinasGrid`) e destino
 * (`CourseDetailView`) chamam **esta** função, nunca um literal. O prefixo é
 * `course-card-` e não `course-`: `course-<id>` já é a chave de camada em
 * `slideBaseKeyOf`, e dois significados na mesma string confundem a leitura.
 */
export const sharedCourseId = (courseId: string): string => `course-card-${courseId}`;
