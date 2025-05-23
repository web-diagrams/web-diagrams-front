import { useDocQuery, useUpdateDocMutation } from "@/app/api/docsApi";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Diagram } from "@/features/Diagram/ui/Diagram";
import { docActions } from "@/redux/doc/slice/docSlice";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast } from 'react-toastify';

export const ServerDoc = () => {
  const { docId = '' } = useParams();
  const dispatch = useAppDispatch();
  const { currentState } = useAppSelector(state => state.doc);
  const isInited = useAppSelector(state => state.doc.isInited);
  const [updateDoc] = useUpdateDocMutation();
  const { data: docInfo } = useDocQuery({ id: docId });

  const onSave = async () => {
    try {
      await updateDoc({ name: currentState.docName, pages: currentState.pages, id: docId }).unwrap();
      dispatch(docActions.onSave({ id: docId }));
      toast.success('Документ сохранен на сервере');
    } catch (error) {
      toast.error('Ошибка при сохранении документа');
    }
  };

  // Кладем в slice док с сервера
  useEffect(() => {
    if (!isInited && docInfo) {
      dispatch(docActions.onLoadDoc(docInfo))
    }
  }, [isInited, docInfo])

  if (!isInited) {
    return <p>'Загрузка и подготовка графика ...'</p>
  }

  return (
    <Diagram onSave={onSave} />
  )
}
