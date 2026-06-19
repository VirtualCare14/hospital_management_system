import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle, Loader2, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';

const flow = ['Home Sample Assigned', 'On The Way To Patient', 'Sample Collected', 'On The Way To Lab', 'Sample Submitted'];

const LabAssistantPortal = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const assignedRequests = requests.filter((request) => request.assignedAssistantId?._id === user?._id);

  const load = async () => {
    setLoading(true);
    const { data } = await client.get('/lab/requests?homeOnly=true');
    setRequests(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const nextStatus = (status) => {
    const index = flow.indexOf(status);
    if (index === -1 || index === flow.length - 1) return null;
    return flow[index + 1];
  };

  const update = async (request) => {
    await client.put(`/lab/requests/${request._id}`, { sampleStatus: nextStatus(request.sampleStatus) });
    toast.success('Sample status updated');
    load();
  };

  return (
    <div className="min-h-screen bg-orange-50 p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Home Sample Collection</h1>
          <p className="text-sm text-gray-500">Assigned requests use existing UHID and patient records.</p>
        </div>
        {loading ? <div className="flex items-center gap-2 rounded-lg bg-white p-6 font-bold text-orange-600"><Loader2 className="h-5 w-5 animate-spin" /> Loading requests</div> : (
          <div className="grid gap-4">
            {requests.length === 0 ? (
              <div className="rounded-lg border border-dashed border-orange-200 bg-white p-8 text-center text-sm font-semibold text-gray-500">No home collection requests.</div>
            ) : assignedRequests.length === 0 ? (
              <div className="rounded-lg border border-dashed border-orange-200 bg-white p-8 text-center text-sm font-semibold text-gray-500">No home collection requests assigned to you.</div>
            ) : (
              assignedRequests.map((request) => (
                <div key={request._id} className="rounded-lg border border-orange-100 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-lg font-extrabold text-gray-900">{request.patientId?.patientName}</h2>
                      <p className="text-sm text-gray-500">{request.labId} | UHID {request.patientId?.uhid} | {request.patientId?.gender} | {request.patientId?.mobile}</p>
                      <p className="mt-2 flex gap-2 text-sm text-gray-600"><MapPin className="h-4 w-4 text-orange-500" /> {request.patientId?.address}</p>
                      <div className="mt-3 flex flex-wrap gap-2">{request.tests?.map((test) => <span key={test} className="rounded-full bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">{test}</span>)}</div>
                    </div>
                    <div className="min-w-60 rounded-lg bg-orange-50 p-3">
                      <p className="text-xs font-bold uppercase text-orange-500">Collection</p>
                      <p className="font-bold text-gray-900">{request.collectionTime || 'Time not set'}</p>
                      <p className="mt-2 text-xs font-bold uppercase text-orange-500">Status</p>
                      <p className="text-gray-700">{request.sampleStatus}</p>
                      {(() => {
                        const next = nextStatus(request.sampleStatus);
                        return next ? (
                          <button className="btn mt-3 w-full" onClick={() => update(request)}><CheckCircle className="h-4 w-4" /> Mark {next}</button>
                        ) : (
                          <button className="btn mt-3 w-full cursor-not-allowed opacity-60" disabled><CheckCircle className="h-4 w-4" /> No further update</button>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LabAssistantPortal;
