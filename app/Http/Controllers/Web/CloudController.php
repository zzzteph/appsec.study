<?php

namespace App\Http\Controllers\Web;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Course;
use App\Models\Cloud;
use App\Models\UserCloudVm;
use App\Models\UserToolVm;
use App\Jobs\Google\ActionStop;
use App\Jobs\Google\ToolStart;
use App\Jobs\Google\ToolStop;
use Illuminate\Support\Facades\Storage;
class CloudController extends Controller
{
	public function monitor()
    {
      return view('admin.cloud.monitor', [
            'tasks' => UserCloudVm::where('status','!=','terminated')->orderBy('updated_at','DESC')->paginate(20)
        ]);

	
    }
	

	
	
	public function update_cloud_task($task_id)
	{
		$user_vm=UserCloudVm::find($task_id);
		$user_vm->status="tostop";
		$user_vm->progress=100;
		$user_vm->save();
		$user_vm->touch();
		ActionStop::dispatch($user_vm)->onQueue('google');
		return redirect()->back();
	}
}
	
	
	
	
	
	

