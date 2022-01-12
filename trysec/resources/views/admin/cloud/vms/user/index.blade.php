@include('include.header')



	 <section class="section">
		 <div class="container">
 
@if (isset($vm->id))
	<form method="POST" action="{{route('admin-update-user-vms')}}">
    @csrf
	 @method('PUT')
	 <input type="hidden" name="id" value="{{$vm->id}}">
	@else 
	 <form method="POST"  action="{{route('admin-create-user-vms')}}">
    @csrf
	 
	@endif
<h1 class="title">User VM configuration</h1>
<div class="field">
  <label class="label">Name</label>
  <div class="control">
	@if (isset($vm->name))
  
	
		<input class="input" type="text" name="name" value="{{$vm->name}}">
	
	@else
		<input class="input" type="text" placeholder="vm name" name="name" value="">
	@endif
	
  </div>
</div>

<div class="field">
  <label class="label">Cloud id</label>
  <div class="control">
	@if (isset($vm->cloud->template_id))
  
	
		<input class="input" type="text" name="template" value="{{$vm->cloud->template_id}}">
	
	@else
		<input class="input" type="text" placeholder="Template ID" name="template" value="">
	@endif
	
  </div>
</div>



<div class="field">
  <div class="control">
    <button class="button is-success is-large">Save</button>
  </div>
</div>
</form>
<hr/>
@if (isset($vm->id))
					<form method="POST" action="{{route('admin-delete-user-vms')}}">
					@csrf
					 @method('DELETE')
				 <input type="hidden" name="id" value="{{$vm->id}}">
					 <button class="button is-danger">Delete</button>
					 </form>
@endif
    </div>

    </section>



@include('include.footer')