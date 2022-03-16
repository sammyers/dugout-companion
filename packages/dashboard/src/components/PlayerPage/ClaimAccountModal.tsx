import React, { FC, useCallback, useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Form,
  FormField,
  Heading,
  Layer,
  Notification,
  Spinner,
  Text,
  TextInput,
} from 'grommet';

import { useClaimPlayerAccountMutation, useVerifyEmailMutation } from '@sammyers/dc-shared';

import { PlayerProfile } from './types';

interface StartClaimStageProps {
  playerId: string;
  onCompleted: (email: string) => void;
  onCancel: () => void;
  onError: (message: string) => void;
}

const StartClaimStage: FC<StartClaimStageProps> = ({
  playerId,
  onCompleted,
  onCancel,
  onError,
}) => {
  const [formValues, setFormValues] = useState({ email: '' });
  const emailRef = useRef('');

  useEffect(() => {
    if (formValues.email) {
      emailRef.current = formValues.email;
    }
  }, [formValues]);

  const [startClaim, { loading, error }] = useClaimPlayerAccountMutation({
    onCompleted: data => {
      if (data.initiatePlayerClaim?.success) {
        onCompleted(emailRef.current);
      }
    },
    errorPolicy: 'all',
  });

  useEffect(() => {
    if (error) {
      onError(error.message);
    }
  }, [error]);

  return (
    <Form
      value={formValues}
      onChange={setFormValues}
      onSubmit={({ value }) => startClaim({ variables: { email: value.email, playerId } })}
    >
      <FormField
        label="Email"
        name="email"
        htmlFor="claim-email"
        required
        validate={[
          {
            regexp: /^[a-z0-9\._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/,
            message: 'Invalid email address.',
          },
        ]}
      >
        <TextInput name="email" type="email" id="claim-email" />
      </FormField>
      <Box direction="row" justify="between">
        <Button label="Cancel" onClick={onCancel} />
        <Button
          primary
          type="submit"
          label="Start Claim"
          disabled={loading}
          icon={loading ? <Spinner /> : undefined}
        />
      </Box>
    </Form>
  );
};

interface VerifyEmailStageProps {
  email: string;
  onCompleted: () => void;
  onError: (message: string) => void;
}

const VerifyEmailStage: FC<VerifyEmailStageProps> = ({ email, onCompleted, onError }) => {
  const [formValues, setFormValues] = useState({ code: '' });

  const [verifyEmail, { loading, error }] = useVerifyEmailMutation({
    onCompleted: data => {
      if (data.verifyEmail?.success) {
        onCompleted();
      }
    },
    errorPolicy: 'all',
  });

  useEffect(() => {
    if (error) {
      onError(error.message);
    }
  }, [error]);

  return (
    <Form
      value={formValues}
      onChange={setFormValues}
      onSubmit={({ value }) => verifyEmail({ variables: { ...value, email } })}
    >
      <Text>Enter the verification code sent to {email}.</Text>
      <FormField
        label="Code"
        name="code"
        htmlFor="claim-code"
        required
        validate={[
          {
            regexp: /^[a-f0-9]{6}$/,
            message: 'Invalid verification code.',
          },
        ]}
      >
        <TextInput name="code" type="text" id="claim-code" />
      </FormField>
      <Box direction="row" justify="between">
        <Button
          primary
          type="submit"
          label="Verify Email"
          disabled={loading}
          icon={loading ? <Spinner /> : undefined}
        />
      </Box>
    </Form>
  );
};

interface Props {
  visible: boolean;
  onClose: () => void;
  player: Pick<PlayerProfile, 'id' | 'fullName'>;
}

const ClaimAccountModal: FC<Props> = ({ visible, onClose, player }) => {
  const [errorMessage, setErrorMessage] = useState<string>();

  const [email, setEmail] = useState<string>();
  const [emailVerified, setEmailVerified] = useState(false);

  return (
    <>
      {!!errorMessage && (
        <Notification
          toast
          status="critical"
          title="Claim unsuccessful"
          message={errorMessage}
          onClose={() => setErrorMessage(undefined)}
        />
      )}
      {visible && (
        <Layer
          onClickOutside={!email ? onClose : undefined}
          background="transparent"
          responsive={false}
        >
          <Box
            pad={{ horizontal: 'medium', bottom: 'medium' }}
            width="medium"
            background="light-2"
            alignSelf="center"
          >
            <Heading level={4}>
              {emailVerified
                ? `Account claim submitted for ${player.fullName}`
                : `Claim account for ${player.fullName}`}
            </Heading>
            {emailVerified ? (
              <Box gap="medium">
                <Text>
                  An administrator will review your claim; if approved, you will receive a
                  confirmation email when your new acount has been created.
                </Text>
                <Button label="Close" onClick={onClose} alignSelf="center" />
              </Box>
            ) : email ? (
              <VerifyEmailStage
                email={email}
                onCompleted={() => setEmailVerified(true)}
                onError={setErrorMessage}
              />
            ) : (
              <StartClaimStage
                playerId={player.id}
                onCompleted={setEmail}
                onError={setErrorMessage}
                onCancel={onClose}
              />
            )}
          </Box>
        </Layer>
      )}
    </>
  );
};

export default ClaimAccountModal;
