interface Props {
  warning: string;
}

export const Warning = (props: Props) => {
  return (
    <>
      {props.warning && (
        <div className="bg-neutral-100 text-red-600 mb-6 px-2 pt-1">
          {props.warning}
        </div>
      )}
    </>
  );
};
