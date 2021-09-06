<?php

namespace App\Http\Controllers\Web;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Course;
use App\Models\Topic;
use App\Models\Lesson;
use App\Models\TheoryLesson;
use App\Models\LabLesson;
use App\Models\Vm;
use App\Models\LabLessonQuestion;
use App\Models\UserCloudVm;
use App\Models\Cloud;
use App\Models\CloudVm;
use App\Models\Iamtoken;
use App\Jobs\Yandex\ActionStart;
use App\Jobs\Yandex\ActionStop;
use App\Jobs\Yandex\CheckRunning;
use App\Jobs\Yandex\Timeout;

use App\Models\UserLabLessonQuestion;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Bus;
class UserVmsController extends Controller
{
	
	
	public function admin_get()
    {

			return view('admin.cloud.vms.user.index',['vm' =>Vm::where('type','user')->first()]);

	
    }

	
	
	public function create(Request $request)
	{
		
		$validated = $request->validate([
			'name' => 'required',
			'template' => 'required'
		]);

		$cloud=Cloud::first();
		if($cloud==null)
		return back()->withErrors(['Cloud not set!']);
		$vm=new Vm;
		$vm->name=$request->input('name');
		$vm->type='user';
		$vm->save();
		$cloudVM=new CloudVm;
		$cloudVM->template_id=$request->input('template');
		$cloudVM->cloud_id=$cloud->id;
		$vm->cloud()->save($cloudVM);
		return back();

	}
	
	
	
		public function update(Request $request)
	{
		$validated = $request->validate([
			'id' => 'required',
			'name' => 'required',
			'template' => 'required'
		]);
		
		$cloud=Cloud::first();
		if($cloud==null)
		return back()->withErrors(['Cloud not set!']);
		$vm=Vm::findOrFail($request->input('id'));
		$vm->name=$request->input('name');
		
		$vm->save();
		$vm->cloud->template_id=$request->input('template');
		$vm->cloud->save();
		return back();

	}


	
	
	public function delete(Request $request)
	{		
		$validated = $request->validate([
			'id' => 'required'
		]);

		 Vm::where('id', $request->input('id'))->delete();
		return back();
	}





}
	
	
	
	
	
	

