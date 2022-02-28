<?php

namespace App\Http\Controllers\Web;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Vm;
use App\Models\CloudVm;
use App\Models\VmConfig;
use App\Models\Cloud;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\RedirectResponse;
class VmsController extends Controller
{
	
	public function get()
    {
      return view('vms.index', [
            'vms' => Vm::where('type','!=','user')->orderBy('id')->paginate(15)
        ]);
    }
	
	
	public function create(Request $request)
	{
		$validated = $request->validate([
			'name' => 'required',
			'cloud_id' => 'required',
			'type' => 'required'
		]);
		
		$cloud=Cloud::first();
		if($cloud==null)
		return back()->withErrors(['Cloud not set!']);
		$vm=new Vm;
		$vm->name=$request->input('name');
		$vm->type=$request->input('type');
		$vm->save();
		$cloudVM=new CloudVm;
		$cloudVM->template_id=$request->input('cloud_id');
		$cloudVM->cloud_id=$cloud->id;
		$vm->cloud()->save($cloudVM);

		return back();
	}
	

	public function update(Request $request,$id)
	{
		$validated = $request->validate([
		
			'name' => 'required',
			'cloud_id' => 'required',
			'type' => 'required'
		]);
		
		$cloud=Cloud::first();
		if($cloud==null)
			return back()->withErrors(['Cloud not set!']);
		$vm=Vm::findOrFail($id);
		$vm->name=$request->input('name');
		$vm->type=$request->input('type');
		$vm->save();
		$vm->cloud->template_id=$request->input('cloud_id');
		$vm->cloud->save();
		return back();
	}
	

	public function delete(Request $request,$id)
	{

		
		$cloud=Cloud::first();
		if($cloud==null)
		return back()->withErrors(['Cloud not set!']);
		$vm=Vm::findOrFail($id);
		$vm->delete();
		return back();
	}
	


}
	
	
	
	
	
	

