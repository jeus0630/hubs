import React, { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { PromoteClientModal } from "./PromoteClientModal";
import { getAvatarThumbnailUrl } from "../../utils/avatar-utils";
import { UserProfileSidebar } from "./UserProfileSidebar.js";
import { SignInMessages } from "../auth/SignInModal";

export function UserProfileSidebarContainer({
  user,
  hubChannel,
  performConditionalSignIn,
  showBackButton,
  onBack,
  onClose,
  onCloseDialog,
  showNonHistoriedDialog
}) {
  const [avatarThumbnailUrl, setAvatarThumbnailUrl] = useState();

  const {
    id: userId,
    profile: { displayName, identityName, avatarId },
    roles
  } = user;
  const mayKick = hubChannel.canOrWillIfCreator("kick_users");
  const hasMicPresence = !!user.micPresence;
  const isNetworkMuted = user.micPresence?.muted;
  const mayMute = !isNetworkMuted && hubChannel.canOrWillIfCreator("mute_users");
  const [isOwner, setIsOwner] = useState(!!roles.owner);
  const isCreator = !!roles.creator;
  const isSignedIn = !!roles.signed_in;
  const mayAddOwner = hubChannel.canOrWillIfCreator("update_roles") && !isOwner && !isCreator;
  const mayRemoveOwner = hubChannel.canOrWillIfCreator("update_roles") && isOwner && !isCreator;
  const mayShare = hubChannel.canOrWillIfCreator("grant_share_screen");
  const mayApplyMute = hubChannel.canOrWillIfCreator("apply_mute");
  const mayFreeze = hubChannel.canOrWillIfCreator("freeze");
  const [isHidden, setIsHidden] = useState(hubChannel.isHidden(user.id));

  useEffect(
    () => {
      if (avatarId) {
        getAvatarThumbnailUrl(avatarId).then(avatarThumbnailUrl => setAvatarThumbnailUrl(avatarThumbnailUrl));
      }
    },
    [avatarId, setAvatarThumbnailUrl, user]
  );

  const addOwner = useCallback(
    () => {
      performConditionalSignIn(
        () => hubChannel.can("update_roles"),
        async () => {
          showNonHistoriedDialog(PromoteClientModal, {
            displayName,
            onConfirm: async () => {
              setIsOwner(true);
              await hubChannel.addOwner(userId);
              onCloseDialog();
            }
          });
        },
        SignInMessages.addOwner
      );
    },
    [performConditionalSignIn, hubChannel, showNonHistoriedDialog, userId, onCloseDialog, displayName]
  );

  const removeOwner = useCallback(
    () => {
      performConditionalSignIn(
        () => hubChannel.can("update_roles"),
        async () => {
          setIsOwner(false);
          await hubChannel.removeOwner(userId);
        },
        SignInMessages.removeOwner
      );
    },
    [performConditionalSignIn, hubChannel, userId]
  );

  const toggleHidden = useCallback(
    () => {
      if (isHidden) {
        hubChannel.unhide(userId);
      } else {
        hubChannel.hide(userId);
      }

      setIsHidden(!isHidden);
    },
    [isHidden, userId, hubChannel]
  );

  const mute = useCallback(
    () => {
      performConditionalSignIn(
        () => hubChannel.can("mute_users"),
        async () => await hubChannel.mute(userId),
        SignInMessages.muteUser
      );
    },
    [performConditionalSignIn, hubChannel, userId]
  );

  const kick = useCallback(
    () => {
      performConditionalSignIn(
        () => hubChannel.can("kick_users"),
        async () => await hubChannel.kick(userId),
        SignInMessages.kickUser
      );

      if (onClose) {
        onClose();
      } else if (onBack) {
        onBack();
      }
    },
    [performConditionalSignIn, hubChannel, userId, onClose, onBack]
  );

  const grantShareScreen = useCallback(
    () => {
      performConditionalSignIn(
        () => hubChannel.can("grant_share_screen"),
        async () => await hubChannel.grantShareScreen(userId),
        SignInMessages.shareScreen
      );
    },
    [performConditionalSignIn, hubChannel, userId]
  );

  const revokeShareScreen = useCallback(
    () => {
      performConditionalSignIn(
        () => hubChannel.can("grant_share_screen"),
        async () => await hubChannel.revokeShareScreen(userId),
        SignInMessages.shareScreen
      );
    },
    [performConditionalSignIn, hubChannel, userId]
  );

  const applyMute = useCallback(
    () => {
      performConditionalSignIn(
        () => hubChannel.can("apply_mute"),
        async () => await hubChannel.applyMute(userId),
        SignInMessages.applyMute
      );
    },
    [performConditionalSignIn, hubChannel, userId]
  );

  const cancelMute = useCallback(
    () => {
      performConditionalSignIn(
        () => hubChannel.can("apply_mute"),
        async () => await hubChannel.cancelMute(userId),
        SignInMessages.applyMute
      );
    },
    [performConditionalSignIn, hubChannel, userId]
  );

  const freeze = useCallback(
    () => {
      performConditionalSignIn(
        () => hubChannel.can("freeze"),
        async () => await hubChannel.freeze(userId),
        SignInMessages.freeze
      );
    },
    [performConditionalSignIn, hubChannel, userId]
  );

  const unfreeze = useCallback(
    () => {
      performConditionalSignIn(
        () => hubChannel.can("freeze"),
        async () => await hubChannel.unfreeze(userId),
        SignInMessages.freeze
      );
    },
    [performConditionalSignIn, hubChannel, userId]
  );

  return (
    <UserProfileSidebar
      userId={user.id}
      displayName={displayName}
      identityName={identityName}
      avatarPreview={<img src={avatarThumbnailUrl} />}
      isSignedIn={isSignedIn}
      canPromote={mayAddOwner}
      onPromote={addOwner}
      canDemote={mayRemoveOwner}
      onDemote={removeOwner}
      isHidden={isHidden}
      onToggleHidden={toggleHidden}
      canMute={mayMute}
      isNetworkMuted={isNetworkMuted}
      onMute={mute}
      canKick={mayKick}
      onKick={kick}
      showBackButton={showBackButton}
      onClose={onClose}
      onBack={onBack}
      hasMicPresence={hasMicPresence}
      canShare={mayShare}
      onGrantShare={grantShareScreen}
      onRevokeShare={revokeShareScreen}
      canApplyMute={mayApplyMute}
      onApplyMute={applyMute}
      onCancelMute={cancelMute}
      canFreeze={mayFreeze}
      onFreeze={freeze}
      onUnfreeze={unfreeze}
    />
  );
}

UserProfileSidebarContainer.propTypes = {
  user: PropTypes.object.isRequired,
  hubChannel: PropTypes.object,
  performConditionalSignIn: PropTypes.func,
  showBackButton: PropTypes.bool,
  onBack: PropTypes.func,
  onClose: PropTypes.func,
  onCloseDialog: PropTypes.func.isRequired,
  showNonHistoriedDialog: PropTypes.func
};
