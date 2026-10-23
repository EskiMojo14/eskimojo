import { useId, useState } from "react";
import { fn } from "storybook/test";

import preview from "#.storybook/preview";

import { Dialog, DialogContent, type DialogProps } from "./index";

const meta = preview.meta({
  title: "Components/Dialog",
  component: Dialog,
  args: {
    open: true,
    onClose: fn<NonNullable<DialogProps["onClose"]>>(),
    onCancel: fn<NonNullable<DialogProps["onCancel"]>>(),
    children: (
      <DialogContent title="Discard changes?" description="Your changes have not been saved.">
        <p>Are you sure you want to leave without saving?</p>
      </DialogContent>
    ),
  },
  argTypes: {
    closedby: {
      control: "select",
      options: ["any", "closerequest", "none"],
      description:
        'Native dismissal policy: "any" allows Escape and backdrop dismissal (default), "closerequest" allows Escape only, and "none" requires an explicit action.',
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Dialog manages native modal behavior and spring transitions. DialogContent provides the title, optional description, body, and actions, and automatically labels the dialog. Function children receive { close, requestClose }. Both accept an optional return value. close() is definitive; requestClose() fires onCancel first and can be prevented with event.preventDefault(). Explicit requestClose() works even with closedby="none". Custom content must supply aria-label or aria-labelledby. Keep Dialog mounted for exit transitions and synchronize open in onClose.',
      },
    },
  },
});

export const Default = meta.story({});

function InteractiveDialog({
  onClose,
  onCancel,
  renderProp = false,
}: Pick<DialogProps, "onClose" | "onCancel"> & { renderProp?: boolean }) {
  const [open, setOpen] = useState(false);
  const [returnValue, setReturnValue] = useState<string>();
  const formId = useId();

  return (
    <>
      <button onClick={() => setOpen(true)}>Open dialog</button>
      <output>
        {returnValue === undefined
          ? "No result yet."
          : `Dialog returned: ${JSON.stringify(returnValue)}`}
      </output>
      <Dialog
        open={open}
        onCancel={onCancel}
        onClose={(event) => {
          setReturnValue(event.currentTarget.returnValue);
          onClose?.(event);
          setOpen(false);
        }}
      >
        {renderProp ? (
          ({ close, requestClose }) => (
            <DialogContent
              title="Discard changes?"
              description="Your changes have not been saved."
              actions={
                <>
                  <button onClick={() => requestClose("keep")}>Keep editing</button>
                  <button onClick={() => close("discard")}>Discard</button>
                </>
              }
            >
              <p>Are you sure you want to leave without saving?</p>
            </DialogContent>
          )
        ) : (
          <DialogContent
            title="Discard changes?"
            description="Your changes have not been saved."
            actions={
              <>
                <button type="submit" form={formId} value="keep">
                  Keep editing
                </button>
                <button type="submit" form={formId} value="discard">
                  Discard
                </button>
              </>
            }
          >
            <p>Are you sure you want to leave without saving?</p>
            <form id={formId} method="dialog" />
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

export const Controlled = meta.story({
  render: ({ onClose, onCancel }) => <InteractiveDialog onClose={onClose} onCancel={onCancel} />,
  parameters: {
    docs: {
      description: {
        story:
          'The actions submit an associated form with method="dialog". The clicked button’s value becomes event.currentTarget.returnValue in onClose. Read it synchronously before updating state. Escape and backdrop dismissal do not set a new return value; native dialogs retain the previous value across openings.',
      },
    },
  },
});

export const RenderProp = meta.story({
  render: ({ onClose, onCancel }) => (
    <InteractiveDialog onClose={onClose} onCancel={onCancel} renderProp />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Children receive { close, requestClose }. Keep editing calls requestClose("keep"), logging onCancel before onClose; Discard calls close("discard"), bypassing onCancel. Both return their value through onClose.',
      },
    },
  },
});
