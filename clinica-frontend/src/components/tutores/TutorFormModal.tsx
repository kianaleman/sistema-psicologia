import { toast } from 'sonner';
import type { Dispatch, FormEvent, SetStateAction } from 'react';
import type {
  EstadoCivil,
  Ocupacion,
  Parentesco,
} from '../../types';
import type { TutorFormData } from '../../hooks/useTutores';

interface TutorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  formData: TutorFormData;
  setFormData: Dispatch<SetStateAction<TutorFormData>>;
  catalogos: {
    ocupaciones: Ocupacion[];
    estadosCiviles: EstadoCivil[];
    parentescos: Parentesco[];
  };
}

const formatearCedula = (valor: string) => {
  let texto = valor.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  if (texto.length > 14) texto = texto.slice(0, 14);
  if (texto.length > 9) return `${texto.slice(0, 3)}-${texto.slice(3, 9)}-${texto.slice(9)}`;
  if (texto.length > 3) return `${texto.slice(0, 3)}-${texto.slice(3)}`;

  return texto;
};

const esCedulaValida = (cedula: string) => /^\d{3}-\d{6}-\d{4}[A-Z]$/.test(cedula);
const esTelefonoValido = (telefono: string) => /^[2578]\d{7}$/.test(telefono.replace(/[\s-]/g, ''));

const toNumber = (value: string) => {
  const parsed = Number(value);

  return Number.isInteger(parsed) ? parsed : 0;
};

export default function TutorFormModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  catalogos,
}: TutorFormModalProps) {
  if (!isOpen) return null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!esCedulaValida(formData.No_Cedula)) {
      toast.error('Formato de cédula inválido. Usa XXX-XXXXXX-XXXXL.');
      return;
    }

    if (!esTelefonoValido(formData.No_Telefono)) {
      toast.error('Teléfono inválido. Debe tener 8 dígitos e iniciar con 2, 5, 7 u 8.');
      return;
    }

    if (!formData.ID_Parentesco || !formData.Ocupacion || !formData.EstadoCivil) {
      toast.error('Selecciona parentesco, ocupación y estado civil.');
      return;
    }

    onSubmit(event);
  };

  return (
    <dialog className="modal modal-open backdrop-blur-sm">
      <div className="modal-box w-11/12 max-w-3xl bg-white p-0 rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-slate-800 text-white px-8 py-4 border-b border-slate-200 flex justify-between items-center gap-4">
          <h3 className="font-bold text-lg font-serif truncate">Editar Información del Tutor</h3>
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost text-slate-200 shrink-0"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto text-slate-700 bg-slate-50">
            <section>
              <label className="label-text font-bold text-slate-500 uppercase text-xs">Datos personales</label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div className="form-control">
                  <label className="label pt-0"><span className="label-text-alt">Nombre</span></label>
                  <input
                    required
                    type="text"
                    className="input input-bordered bg-white"
                    value={formData.Nombre}
                    onChange={(event) => setFormData((prev) => ({ ...prev, Nombre: event.target.value }))}
                  />
                </div>

                <div className="form-control">
                  <label className="label pt-0"><span className="label-text-alt">Apellido</span></label>
                  <input
                    required
                    type="text"
                    className="input input-bordered bg-white"
                    value={formData.Apellido}
                    onChange={(event) => setFormData((prev) => ({ ...prev, Apellido: event.target.value }))}
                  />
                </div>

                <div className="form-control">
                  <label className="label pt-0"><span className="label-text-alt">Cédula</span></label>
                  <input
                    required
                    type="text"
                    className="input input-bordered bg-white font-mono"
                    value={formData.No_Cedula}
                    maxLength={16}
                    onChange={(event) => setFormData((prev) => ({
                      ...prev,
                      No_Cedula: formatearCedula(event.target.value),
                    }))}
                  />
                </div>

                <div className="form-control">
                  <label className="label pt-0"><span className="label-text-alt">Teléfono</span></label>
                  <input
                    required
                    type="text"
                    className="input input-bordered bg-white"
                    value={formData.No_Telefono}
                    onChange={(event) => setFormData((prev) => ({ ...prev, No_Telefono: event.target.value }))}
                    maxLength={8}
                  />
                </div>
              </div>
            </section>

            <section>
              <label className="label-text font-bold text-slate-500 uppercase text-xs">Información adicional</label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div className="form-control">
                  <label className="label pt-0"><span className="label-text-alt">Parentesco</span></label>
                  <select
                    className="select select-bordered bg-white"
                    value={formData.ID_Parentesco}
                    onChange={(event) => setFormData((prev) => ({
                      ...prev,
                      ID_Parentesco: toNumber(event.target.value),
                    }))}
                  >
                    <option value={0}>Seleccionar...</option>
                    {catalogos.parentescos.map((parentesco) => (
                      <option key={parentesco.ID_Parentesco} value={parentesco.ID_Parentesco}>
                        {parentesco.Nombre_De_Parentesco}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label pt-0"><span className="label-text-alt">Ocupación</span></label>
                  <select
                    className="select select-bordered bg-white"
                    value={formData.Ocupacion}
                    onChange={(event) => setFormData((prev) => ({
                      ...prev,
                      Ocupacion: toNumber(event.target.value),
                    }))}
                  >
                    <option value={0}>Seleccionar...</option>
                    {catalogos.ocupaciones.map((ocupacion) => (
                      <option key={ocupacion.ID_Ocupacion} value={ocupacion.ID_Ocupacion}>
                        {ocupacion.Nombre_DeOcupacion}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control sm:col-span-2">
                  <label className="label pt-0"><span className="label-text-alt">Estado Civil</span></label>
                  <select
                    className="select select-bordered bg-white w-full"
                    value={formData.EstadoCivil}
                    onChange={(event) => setFormData((prev) => ({
                      ...prev,
                      EstadoCivil: toNumber(event.target.value),
                    }))}
                  >
                    <option value={0}>Seleccionar...</option>
                    {catalogos.estadosCiviles.map((estadoCivil) => (
                      <option key={estadoCivil.ID_EstadoCivil} value={estadoCivil.ID_EstadoCivil}>
                        {estadoCivil.Nombre_EstadoCivil}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section>
              <label className="label-text font-bold text-slate-500 uppercase text-xs">Dirección del tutor</label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <input
                  type="text"
                  placeholder="País"
                  className="input input-bordered bg-white"
                  value={formData.Direccion.Pais}
                  onChange={(event) => setFormData((prev) => ({
                    ...prev,
                    Direccion: { ...prev.Direccion, Pais: event.target.value },
                  }))}
                />

                <input
                  type="number"
                  placeholder="ID Municipio"
                  className="input input-bordered bg-white"
                  value={formData.Direccion.ID_Municipio || ''}
                  onChange={(event) => setFormData((prev) => ({
                    ...prev,
                    Direccion: { ...prev.Direccion, ID_Municipio: toNumber(event.target.value) },
                  }))}
                />

                <input
                  type="text"
                  placeholder="Barrio"
                  className="input input-bordered bg-white"
                  value={formData.Direccion.Barrio}
                  onChange={(event) => setFormData((prev) => ({
                    ...prev,
                    Direccion: { ...prev.Direccion, Barrio: event.target.value },
                  }))}
                />

                <input
                  type="text"
                  placeholder="Calle"
                  className="input input-bordered bg-white"
                  value={formData.Direccion.Calle}
                  onChange={(event) => setFormData((prev) => ({
                    ...prev,
                    Direccion: { ...prev.Direccion, Calle: event.target.value },
                  }))}
                />
              </div>
            </section>
          </div>

          <div className="modal-action bg-slate-50 px-8 py-4 border-t border-slate-200 rounded-b-2xl">
            <button type="button" className="btn btn-ghost hover:bg-slate-100" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary text-white">
              Actualizar Tutor
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
