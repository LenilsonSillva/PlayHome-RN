import type { TFunction } from "i18next";

// ============================================================
// Os erros do socket são locale-neutros no backend. Aqui eles
// viram a linguagem selecionada no app (mesma estratégia do
// website: chaves `errors.*` + nome dinâmico preservado).
// ============================================================
export function translateCryptoError(message: string | undefined, t: TFunction): string {
  if (!message) return t("alerts.error");

  const groupPlayers = message.match(/^Group "(.+)" needs at least (\d+) players$/);
  if (groupPlayers) {
    return `${t("alerts.cryptography_group", "Esquadrão")} "${groupPlayers[1]}" ${t(
      "alerts.cryptography_needsAtLeast",
      "precisa de pelo menos"
    )} ${groupPlayers[2]} ${t("alerts.cryptography_players", "jogadores")}`;
  }

  const groupOnline = message.match(/^Group "(.+)" needs at least one online player$/);
  if (groupOnline) {
    return `${t("alerts.cryptography_group", "Esquadrão")} "${groupOnline[1]}" ${t(
      "alerts.cryptography_needsOnlinePlayer",
      "precisa de pelo menos um jogador online"
    )}`;
  }

  const missingManual = message.match(/^Players without a group in manual mode: (.+)$/);
  if (missingManual) {
    return `${t(
      "alerts.cryptography_playersWithoutGroup",
      "Jogadores sem grupo no modo manual:"
    )} ${missingManual[1]}`;
  }

  const groupLimit = message.match(/^The limit of (\d+) groups has been reached$/);
  if (groupLimit) {
    return `${t("alerts.cryptography_groupLimit", "O limite de")} ${groupLimit[1]} ${t(
      "alerts.cryptography_groupsReached",
      "esquadrões foi atingido"
    )}`;
  }

   const alreadyInRoom = message.match(/^You are already in this room as "(.+)"$/);
  if (alreadyInRoom) {
    return `${t("alerts.cryptography_alreadyInRoomAs", "Você já está nesta sala como")} "${alreadyInRoom[1]}"`;
  }

  const idUsedName = message.match(/^This ID already used the name "(.+)" in this room$/);
  if (idUsedName) {
    return `${t("alerts.cryptography_idUsedNameBefore", "Este ID já usou o nome")} "${idUsedName[1]}" ${t(
      "alerts.cryptography_inThisRoom",
      "nesta sala"
    )}`;
  }

  const exact: Record<string, [string, string]> = {
    "Room does not exist": ["alerts.cryptography_roomNotFound", "A sala não existe"],
    "Only the host can do this": ["alerts.cryptography_onlyHost", "Somente o host pode fazer isso"],
    "The match is already in progress": [
      "alerts.cryptography_matchStarted",
      "A partida já está em andamento"
    ],
    "Operators can only be changed at the start of the round": [
      "alerts.cryptography_operatorsStartOnly",
      "Os operadores só podem ser trocados no início da rodada"
    ],
    "You do not have permission to set the operator": [
      "alerts.cryptography_cannotSetOperator",
      "Você não tem permissão para definir o operador"
    ],
    "The in-person operator needs the group leader’s online device": [
      "alerts.cryptography_presentOperatorDevice",
      "O operador presencial precisa do dispositivo online do líder do grupo"
    ],
    "Invalid or unavailable player": [
      "alerts.cryptography_invalidPlayer",
      "Jogador inválido ou indisponível"
    ],
    "This action is unavailable during team recognition": [
      "alerts.cryptography_notTeamRecognition",
      "Esta ação não está disponível durante o reconhecimento dos grupos"
    ],
    "The starting group is defined by the previous round winner": [
      "alerts.cryptography_startingGroupAutomatic",
      "O grupo que inicia é definido pelo vencedor da rodada anterior"
    ],
    "Invalid starting group": ["alerts.cryptography_invalidStartingGroup", "Grupo inicial inválido"],
    "Every operator needs an available device": [
      "alerts.cryptography_operatorDevice",
      "Todo operador precisa de um dispositivo disponível"
    ],
    "Every group needs an operator": ["alerts.cryptography_groupOperator", "Todo grupo precisa de um operador"],
    "Only the current operator can do this": [
      "alerts.cryptography_onlyCurrentOperator",
      "Somente o operador da vez pode fazer isso"
    ],
    "This action is unavailable outside the action phase": [
      "alerts.cryptography_outsideAction",
      "Esta ação não está disponível fora da fase de ação"
    ],
    "Wait for all operators to accept the word change": [
      "alerts.cryptography_waitOperators",
      "Aguarde todos os operadores aceitarem a troca de palavra"
    ],
    "The timer is already running": [
      "alerts.cryptography_timerRunning",
      "O cronômetro já está rodando"
    ],
    "This action is only available in Infiltration": [
      "alerts.cryptography_onlyInfiltration",
      "Esta ação só está disponível na Infiltração"
    ],
    "Start the timer first": ["alerts.cryptography_startTimerFirst", "Inicie o cronômetro primeiro"],
    "Action rejected": ["alerts.cryptography_actionRejected", "Ação recusada"],
    "This action is only available in Interception": [
      "alerts.cryptography_onlyInterception",
      "Esta ação só está disponível na Interceptação"
    ],
    "Word changes are only available while the timer is stopped": [
      "alerts.cryptography_wordChangeTimerStopped",
      "Trocas de palavra só podem ser feitas com o cronômetro parado"
    ],
    "Only operators can request a word change": [
      "alerts.cryptography_onlyOperatorsRequest",
      "Somente operadores podem solicitar a troca de palavra"
    ],
    "Your request is already waiting for the other operators": [
      "alerts.cryptography_requestPending",
      "Sua solicitação já está aguardando os outros operadores"
    ],
    "This request cannot be accepted": [
      "alerts.cryptography_requestCannotAccept",
      "Esta solicitação não pode ser aceita"
    ],
    "A word change cannot be requested right now": [
      "alerts.cryptography_wordChangeUnavailable",
      "Não é possível solicitar a troca de palavra agora"
    ],
    "Approval is only available while the timer is stopped": [
      "alerts.cryptography_approvalTimerStopped",
      "Aceitar a troca só pode ser feito com o cronômetro parado"
    ],
    "Only operators can accept the word change": [
      "alerts.cryptography_onlyOperatorsAccept",
      "Somente operadores podem aceitar a troca de palavra"
    ],
    "Rejection is only available while the timer is stopped": [
      "alerts.cryptography_rejectionTimerStopped",
      "Recusar a troca só pode ser feito com o cronômetro parado"
    ],
    "Only operators can reject the word change": [
      "alerts.cryptography_onlyOperatorsReject",
      "Somente operadores podem recusar a troca de palavra"
    ],
    "This action is only available in the round report": [
      "alerts.cryptography_onlyRoundReport",
      "Esta ação só está disponível no relatório da rodada"
    ],
    "Adjustment rejected (limit reached?)": [
      "alerts.cryptography_adjustmentRejected",
      "Ajuste recusado (limite atingido?)"
    ],
    "You were removed from this room": [
      "alerts.cryptography_removedFromRoom",
      "Você foi removido desta sala"
    ],
    "That name is already being used in the room": [
      "alerts.cryptography_nameAlreadyUsed",
      "Esse nome já está sendo usado na sala"
    ],
    "Room is full (maximum 20 players)": [
      "alerts.cryptography_roomFull",
      "Sala cheia (máximo 20 jogadores)"
    ],
    "You are not in the room": [
      "alerts.cryptography_notInRoom",
      "Você não está na sala"
    ],
    "You are already the leader of a group and cannot create another": [
      "alerts.cryptography_alreadyLeader",
      "Você já é o líder de um grupo e não pode criar outro"
    ],
    "This group name is already in use": [
      "alerts.cryptography_groupNameInUse",
      "Este nome de grupo já está em uso"
    ],
    "The game has already started": [
      "alerts.cryptography_gameAlreadyStarted",
      "O jogo já começou"
    ],
    "You do not have permission to delete this group": [
      "alerts.cryptography_noPermissionDeleteGroup",
      "Você não tem permissão para excluir este grupo"
    ],
    "The room is still in the lobby": [
      "alerts.cryptography_roomInLobby",
      "A sala ainda está no lobby"
    ],
    "You do not have permission to manage this group": [
      "alerts.cryptography_noPermissionManageGroup",
      "Você não tem permissão para gerenciar este grupo"
    ],
    "Player does not exist": [
      "alerts.cryptography_playerNotFound",
      "Jogador não encontrado"
    ],
    "Player not found or permission denied": [
      "alerts.cryptography_playerNotFoundOrPermissionDenied",
      "Jogador não encontrado ou permissão negada"
    ],
    "The online player is not in this group": [
      "alerts.cryptography_playerNotInGroup",
      "O jogador online não está neste grupo"
    ],
    "This player is already the leader of another group": [
      "alerts.cryptography_playerAlreadyLeader",
      "Este jogador já é o líder de outro grupo"
    ],
    "Group does not exist": [
      "alerts.cryptography_groupNotExists",
      "O grupo não existe"
    ]
  };

  const translated = exact[message];
  return translated ? t(translated[0], translated[1]) : message;
}